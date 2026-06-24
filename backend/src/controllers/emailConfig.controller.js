import * as repository from "../repositories/emailConfig.repository.js";

export const getEmailConfigs = async (req, res) => {
  try {
    const companyCode = req.user.companyCode;
    const configs = await repository.getEmailConfigs(companyCode);
    return res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("getEmailConfigs controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createEmailConfig = async (req, res) => {
  try {
    const companyCode = req.user.companyCode;
    const {
      config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
      email_from_name, welcome_subject, welcome_template,
      send_welcome_email, send_ticket_assignment_email,
      send_chat_reply_email, send_ticket_update_email,
      send_reply_email
    } = req.body;

    if (!config_name) {
      return res.status(400).json({
        success: false,
        message: "Config name is required",
      });
    }

    const newConfig = await repository.createEmailConfig(companyCode, {
      config_name, smtp_host, smtp_port, smtp_user, smtp_pass,
      email_from_name, welcome_subject, welcome_template,
      send_welcome_email: send_welcome_email === undefined ? true : send_welcome_email,
      send_ticket_assignment_email: send_ticket_assignment_email === undefined ? true : send_ticket_assignment_email,
      send_chat_reply_email: send_chat_reply_email === undefined ? true : send_chat_reply_email,
      send_ticket_update_email: send_ticket_update_email === undefined ? true : send_ticket_update_email,
      send_reply_email: send_reply_email === undefined ? true : send_reply_email
    });

    return res.status(201).json({
      success: true,
      data: newConfig,
    });
  } catch (error) {
    console.error("createEmailConfig controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEmailConfig = async (req, res) => {
  try {
    const companyCode = req.user.companyCode;
    const { id } = req.params;
    const data = req.body;

    const updated = await repository.updateEmailConfig(Number(id), companyCode, data);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Email configuration not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("updateEmailConfig controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activateEmailConfig = async (req, res) => {
  try {
    const companyCode = req.user.companyCode;
    const { id } = req.params;

    const activated = await repository.activateEmailConfig(Number(id), companyCode);
    if (!activated) {
      return res.status(404).json({
        success: false,
        message: "Email configuration not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: activated,
    });
  } catch (error) {
    console.error("activateEmailConfig controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmailConfig = async (req, res) => {
  try {
    const companyCode = req.user.companyCode;
    const { id } = req.params;

    const deleted = await repository.deleteEmailConfig(Number(id), companyCode);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "Email configuration not found, unauthorized, or cannot delete active configuration",
      });
    }

    return res.status(200).json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error("deleteEmailConfig controller error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
